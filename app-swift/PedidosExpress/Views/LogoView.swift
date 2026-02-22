import UIKit

/// Logo no estilo RFID: container arredondado com logo DMTN + título "Pedidos Express" + subtítulo.
final class LogoView: UIView {

    private let containerView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.layer.cornerRadius = 20
        v.clipsToBounds = true
        return v
    }()

    private let logoImageView: UIImageView = {
        let iv = UIImageView(image: UIImage(named: "DMTNLogo"))
        iv.contentMode = .scaleAspectFit
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()

    private let titleLabel: UILabel = {
        let l = UILabel()
        l.text = "Pedidos Express"
        l.font = .systemFont(ofSize: 24, weight: .bold)
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let subtitleLabel: UILabel = {
        let l = UILabel()
        l.text = "Pedidos e agendamentos"
        l.font = .systemFont(ofSize: 15, weight: .medium)
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    /// Se true, usa branco para logo e textos (fundo escuro). Se false, usa cores do tema (laranja/escuro).
    var useLightContent: Bool = false {
        didSet { updateAppearance() }
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private func setupView() {
        addSubview(containerView)
        containerView.addSubview(logoImageView)
        addSubview(titleLabel)
        addSubview(subtitleLabel)

        NSLayoutConstraint.activate([
            containerView.topAnchor.constraint(equalTo: topAnchor),
            containerView.centerXAnchor.constraint(equalTo: centerXAnchor),
            containerView.widthAnchor.constraint(equalToConstant: 80),
            containerView.heightAnchor.constraint(equalToConstant: 80),

            logoImageView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            logoImageView.centerYAnchor.constraint(equalTo: containerView.centerYAnchor),
            logoImageView.widthAnchor.constraint(equalTo: containerView.widthAnchor, multiplier: 0.7),
            logoImageView.heightAnchor.constraint(equalTo: containerView.heightAnchor, multiplier: 0.7),

            titleLabel.topAnchor.constraint(equalTo: containerView.bottomAnchor, constant: 12),
            titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            titleLabel.trailingAnchor.constraint(equalTo: trailingAnchor),

            subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 4),
            subtitleLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            subtitleLabel.trailingAnchor.constraint(equalTo: trailingAnchor),
            subtitleLabel.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])

        updateAppearance()
    }

    private func updateAppearance() {
        if useLightContent {
            containerView.backgroundColor = UIColor.white.withAlphaComponent(0.12)
            logoImageView.tintColor = .white
            titleLabel.textColor = .white
            subtitleLabel.textColor = .white.withAlphaComponent(0.8)
        } else {
            containerView.backgroundColor = UIColor.appPrimaryBlack.withAlphaComponent(0.06)
            logoImageView.tintColor = .appPrimaryBlack
            titleLabel.textColor = .appTitleBlack
            subtitleLabel.textColor = .appSubtitleGray
        }
    }
}
